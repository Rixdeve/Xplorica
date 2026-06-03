package com.xplorica.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;

import com.xplorica.dto.GuideAnalyticsResponse;
import com.xplorica.dto.GuideProfileRequest;
import com.xplorica.dto.GuideProfileResponse;
import com.xplorica.dto.RatingRequest;
import com.xplorica.dto.RatingResponse;
import com.xplorica.entity.Booking;
import com.xplorica.entity.DestinationItem;
import com.xplorica.entity.GuideProfile;
import com.xplorica.entity.Rating;
import com.xplorica.entity.User;
import com.xplorica.repository.BookingRepository;
import com.xplorica.repository.GuideProfileRepository;
import com.xplorica.repository.RatingRepository;
import com.xplorica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuideService {

    private final GuideProfileRepository guideRepo;
    private final UserRepository userRepo;
    private final RatingRepository ratingRepo;
    private final BookingRepository bookingRepo;



    public List<GuideProfileResponse> filterGuides(String language, String destination, Double minRating) {
        return guideRepo.filterGuides(language, destination, minRating)
            .stream().map(GuideProfileResponse::from).toList();
    }

    public GuideProfileResponse getById(Long id) {
        return GuideProfileResponse.from(
            guideRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
    }

    @Transactional
    public GuideProfileResponse upsertProfile(String email, GuideProfileRequest req) {
        User user = userRepo.findByEmail(email).orElseThrow();
        GuideProfile profile = guideRepo.findByUserId(user.getId())
            .orElse(GuideProfile.builder().user(user).build());

        boolean isPremium = profile.isEffectivelyPremium();
        List<DestinationItem> destinations = req.getDestinations() == null ? List.of() : req.getDestinations();
        if (!isPremium && destinations.size() > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Non-premium guides can add up to 5 destinations. Upgrade to Premium for unlimited.");

        profile.setDescription(req.getDescription());
        profile.setLicenseNumber(req.getLicenseNumber());
        profile.setYearsExperience(req.getYearsExperience());
        profile.setLanguages(req.getLanguages());
        profile.setDestinations(destinations);
        if (req.getDailyRate() != null) profile.setDailyRate(req.getDailyRate());
        if (profile.getStatus() == null) profile.setStatus(GuideProfile.Status.PENDING);

        return GuideProfileResponse.from(guideRepo.save(profile));
    }

private final Cloudinary cloudinary;


public String uploadPhoto(String email, MultipartFile file) {
    try {
        User user = userRepo.findByEmail(email)
                .orElseThrow();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "xplorica/guides",
                        "public_id", "guide_" + user.getId()
                )
        );

        String imageUrl = uploadResult.get("secure_url").toString();

        GuideProfile profile = guideRepo.findByUserId(user.getId())
                .orElseThrow();

        profile.setPhotoUrl(imageUrl);
        guideRepo.save(profile);

        return imageUrl;

    } catch (IOException e) {
        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Upload failed"
        );
    }
}

    @Transactional
    public void rateGuide(String email, Long guideId, RatingRequest req) {
        User tourist = userRepo.findByEmail(email).orElseThrow();
        GuideProfile guide = guideRepo.findById(guideId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide not found"));
        if (!bookingRepo.hasActiveBooking(tourist.getId(), guide.getUser().getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only rate guides you have booked");
        if (ratingRepo.existsByTouristIdAndGuideId(tourist.getId(), guideId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already rated this guide");

        Rating rating = Rating.builder()
            .tourist(tourist).guide(guide)
            .stars(req.getStars()).comment(req.getComment()).build();
        ratingRepo.save(rating);
        guide.addRating(req.getStars());
        guideRepo.save(guide);
    }

    public List<RatingResponse> getRatings(Long guideId) {
        return ratingRepo.findByGuideIdOrderByCreatedAtDesc(guideId)
            .stream().map(this::toRatingResponse).toList();
    }

    public List<RatingResponse> getLatestReviews() {
        return ratingRepo.findTop9ByOrderByCreatedAtDesc()
            .stream().map(this::toRatingResponse).toList();
    }

    @Transactional
    public GuideProfileResponse subscribe(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        GuideProfile profile = guideRepo.findByUserId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide profile not found"));
        profile.setPremium(true);
        profile.setPremiumExpiresAt(LocalDateTime.now().plusMonths(1));
        return GuideProfileResponse.from(guideRepo.save(profile));
    }

    public GuideAnalyticsResponse getAnalytics(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        GuideProfile profile = guideRepo.findByUserId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide profile not found"));
        if (!profile.isEffectivelyPremium())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Analytics is a Premium feature");

        List<Booking> bookings = bookingRepo.findByGuideIdOrderByCreatedAtDesc(profile.getId());

        GuideAnalyticsResponse r = new GuideAnalyticsResponse();
        r.setTotalBookings((int) bookings.stream().filter(b -> b.getStatus() != Booking.Status.CANCELLED).count());
        r.setCompletedTours((int) bookings.stream().filter(b -> b.getStatus() == Booking.Status.COMPLETED).count());
        r.setConfirmedBookings((int) bookings.stream().filter(b -> b.getStatus() == Booking.Status.CONFIRMED).count());
        r.setPendingBookings((int) bookings.stream().filter(b -> b.getStatus() == Booking.Status.PENDING).count());
        r.setCancelledBookings((int) bookings.stream().filter(b -> b.getStatus() == Booking.Status.CANCELLED).count());
        r.setTotalRevenue(bookings.stream()
            .filter(b -> b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.CONFIRMED)
            .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() - (b.getPlatformCommission() != null ? b.getPlatformCommission() : 0) : 0)
            .sum());
        r.setTotalPeopleServed(bookings.stream()
            .filter(b -> b.getStatus() != Booking.Status.CANCELLED)
            .mapToInt(b -> b.getNumberOfPeople() != null ? b.getNumberOfPeople() : 0).sum());
        r.setUniqueTourists((int) bookings.stream()
            .filter(b -> b.getStatus() != Booking.Status.CANCELLED)
            .map(b -> b.getTourist().getId()).distinct().count());
        r.setAverageRating(profile.getAverageRating() != null ? profile.getAverageRating() : 0.0);
        r.setTotalReviews(profile.getTotalRatings() != null ? profile.getTotalRatings() : 0);

        Map<String, Long> destCounts = new LinkedHashMap<>();
        bookings.stream()
            .filter(b -> b.getDestination() != null && !b.getDestination().isBlank())
            .flatMap(b -> Arrays.stream(b.getDestination().split(",\\s*")))
            .forEach(d -> destCounts.merge(d.trim(), 1L, Long::sum));
        r.setTopDestinations(destCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(Map.Entry::getKey).limit(5).collect(Collectors.toList()));

        // ── Monthly revenue & tour count (last 6 months) ──────────────────
        LinkedHashMap<String, Double>  monthlyRevenue = new LinkedHashMap<>();
        LinkedHashMap<String, Integer> monthlyTours   = new LinkedHashMap<>();
        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym  = now.minusMonths(i);
            String label  = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " '" + String.valueOf(ym.getYear()).substring(2);
            monthlyRevenue.put(label, 0.0);
            monthlyTours.put(label, 0);
        }
        for (Booking b : bookings) {
            if (b.getStatus() == Booking.Status.CANCELLED || b.getStartDate() == null) continue;
            YearMonth ym = YearMonth.from(b.getStartDate());
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " '" + String.valueOf(ym.getYear()).substring(2);
            if (!monthlyRevenue.containsKey(label)) continue;
            double net = b.getTotalAmount() != null
                ? b.getTotalAmount() - (b.getPlatformCommission() != null ? b.getPlatformCommission() : 0)
                : 0;
            monthlyRevenue.merge(label, net, Double::sum);
            if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.CONFIRMED)
                monthlyTours.merge(label, 1, Integer::sum);
        }
        r.setMonthlyRevenue(monthlyRevenue);
        r.setMonthlyTours(monthlyTours);

        // ── Destination booking counts (sorted desc) ──────────────────────
        Map<String, Integer> destBookings = bookings.stream()
            .filter(b -> b.getStatus() != Booking.Status.CANCELLED
                      && b.getDestination() != null && !b.getDestination().isBlank())
            .flatMap(b -> Arrays.stream(b.getDestination().split(",\\s*")))
            .map(String::trim).filter(d -> !d.isBlank())
            .collect(Collectors.groupingBy(d -> d, Collectors.summingInt(d -> 1)));
        r.setDestinationBookings(
            destBookings.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                    (a, b2) -> a, LinkedHashMap::new)));

        return r;
    }

    private RatingResponse toRatingResponse(Rating r) {
        RatingResponse res = new RatingResponse();
        res.setId(r.getId());
        res.setTouristName(r.getTourist().getFullName());
        res.setGuideName(r.getGuide().getUser().getFullName());
        res.setStars(r.getStars());
        res.setComment(r.getComment());
        res.setCreatedAt(r.getCreatedAt());
        return res;
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
