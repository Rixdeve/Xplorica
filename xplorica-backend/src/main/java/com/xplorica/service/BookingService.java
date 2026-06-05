package com.xplorica.service;

import com.xplorica.dto.BookingRequest;
import com.xplorica.dto.BookingResponse;
import com.xplorica.entity.Booking;
import com.xplorica.entity.GuideProfile;
import com.xplorica.entity.User;
import com.xplorica.repository.BookingRepository;
import com.xplorica.repository.GuideProfileRepository;
import com.xplorica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepo;
    private final GuideProfileRepository guideRepo;
    private final UserRepository userRepo;

    private static final List<Booking.Status> LIVE_STATUSES =
        List.of(Booking.Status.PENDING, Booking.Status.CONFIRMED);

    /** Tourist service fee: 15% of booking total, capped between $2 and $5, rounded to 2 dp. */
    private static double calcServiceFee(double total) {
        double fee = total * 0.15;
        fee = Math.max(2.0, Math.min(5.0, fee));
        return Math.round(fee * 100.0) / 100.0;
    }

    /** Platform commission: 15% of booking total (stays within 10–25% range), rounded to 2 dp. */
    private static double calcPlatformCommission(double total) {
        return Math.round(total * 0.15 * 100.0) / 100.0;
    }

    @Transactional
    public BookingResponse createBooking(String email, BookingRequest req) {
        User tourist = userRepo.findByEmail(email).orElseThrow();
        GuideProfile guide = guideRepo.findById(req.getGuideId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide not found"));

        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "End date must be on or after the start date");

        if (bookingRepo.existsByGuideIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusIn(
                guide.getId(), req.getEndDate(), req.getStartDate(), LIVE_STATUSES))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This guide is not available on the selected dates");

        // Compute total from selected destination prices × days (no per-person multiplier)
        List<String> selectedNames = (req.getDestination() != null && !req.getDestination().isBlank())
            ? Arrays.asList(req.getDestination().split(",\\s*"))
            : List.of();

        double destTotal = guide.getDestinations() != null
            ? guide.getDestinations().stream()
                .filter(d -> d.getName() != null && selectedNames.contains(d.getName().trim()))
                .mapToDouble(d -> d.getPrice() != null ? d.getPrice() : 0.0)
                .sum()
            : 0.0;

        long days = ChronoUnit.DAYS.between(req.getStartDate(), req.getEndDate()) + 1;

        // Fall back to dailyRate if no destination prices are configured yet
        double subtotal = destTotal > 0
            ? destTotal * days
            : (guide.getDailyRate() != null ? guide.getDailyRate() * days : 0.0);

        double serviceFee = calcServiceFee(subtotal);
        double platformCommission = calcPlatformCommission(subtotal);
        Booking b = Booking.builder()
            .tourist(tourist).guide(guide)
            .startDate(req.getStartDate())
            .endDate(req.getEndDate())
            .numberOfPeople(req.getNumberOfPeople())
            .totalAmount(subtotal)
            .serviceFee(serviceFee)
            .platformCommission(platformCommission)
            .destination(req.getDestination())
            .build();
        return toResponse(bookingRepo.save(b));
    }

    public List<BookingResponse> getMyBookings(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        if (user.getRole() == User.Role.TOURIST)
            return bookingRepo.findByTouristIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
        GuideProfile g = guideRepo.findByUserId(user.getId()).orElseThrow();
        return bookingRepo.findByGuideIdOrderByCreatedAtDesc(g.getId())
            .stream().map(this::toResponse).toList();
    }

    /** Tourist pays — only allowed once the guide has accepted (CONFIRMED) */
    @Transactional
    public BookingResponse confirmPayment(String email, Long bookingId) {
        Booking b = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (b.getStatus() != Booking.Status.CONFIRMED)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Payment is only available after the guide has accepted your booking");

        b.setPaymentStatus(Booking.PaymentStatus.PAID);
        return toResponse(bookingRepo.save(b));
    }

    /** Admin — all bookings ordered by newest first */
    public List<BookingResponse> getAllBookings() {
        return bookingRepo.findAllByOrderByCreatedAtDesc()
            .stream().map(this::toResponse).toList();
    }

    /** Guide accepts or rejects a booking; tourist may cancel their own PENDING booking */
    @Transactional
    public BookingResponse updateStatus(String email, Long bookingId, Booking.Status status) {
        User user = userRepo.findByEmail(email).orElseThrow();
        Booking b = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (user.getRole() == User.Role.GUIDE) {
            GuideProfile guideProfile = guideRepo.findByUserId(user.getId()).orElseThrow();
            if (!b.getGuide().getId().equals(guideProfile.getId()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your booking");
            if (status != Booking.Status.CONFIRMED && status != Booking.Status.CANCELLED && status != Booking.Status.COMPLETED)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Guide can only confirm, complete, or cancel a booking");
        } else {
            if (!b.getTourist().getId().equals(user.getId()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your booking");
            if (status != Booking.Status.CANCELLED)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tourists can only cancel their own bookings");
            if (b.getStatus() != Booking.Status.PENDING)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only a pending booking can be cancelled");
        }

        b.setStatus(status);
        return toResponse(bookingRepo.save(b));
    }

    private BookingResponse toResponse(Booking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setGuideProfileId(b.getGuide().getId());
        r.setTouristId(b.getTourist().getId());
        r.setGuideName(b.getGuide().getUser().getFullName());
        r.setTouristName(b.getTourist().getFullName());
        r.setStartDate(b.getStartDate());
        r.setEndDate(b.getEndDate());
        r.setNumberOfPeople(b.getNumberOfPeople());
        r.setTotalAmount(b.getTotalAmount());
        r.setServiceFee(b.getServiceFee());
        r.setPlatformCommission(b.getPlatformCommission());
        r.setStatus(b.getStatus().name());
        r.setPaymentStatus(b.getPaymentStatus().name());
        r.setDestination(b.getDestination());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }
}
