package com.xplorica.service;

import com.xplorica.dto.AdminAnalyticsResponse;
import com.xplorica.dto.GuideProfileResponse;
import com.xplorica.entity.Booking;
import com.xplorica.entity.GuideProfile;
import com.xplorica.repository.BookingRepository;
import com.xplorica.repository.GuideProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final GuideProfileRepository guideRepo;
    private final BookingRepository      bookingRepo;

    public List<GuideProfileResponse> listGuides(String status) {
        if (status == null || status.isBlank()) {
            return guideRepo.findAllByOrderByIdDesc().stream()
                .map(GuideProfileResponse::from).toList();
        }
        try {
            GuideProfile.Status s = GuideProfile.Status.valueOf(status.toUpperCase());
            return guideRepo.findByStatusOrderByIdDesc(s).stream()
                .map(GuideProfileResponse::from).toList();
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }
    }

    public AdminAnalyticsResponse getAnalytics() {
        List<Booking> all  = bookingRepo.findAll();
        List<Booking> paid = all.stream()
            .filter(b -> b.getPaymentStatus() == Booking.PaymentStatus.PAID)
            .toList();

        // ── Daily revenue — last 30 days ──────────────────────────────────
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("MMM d");
        LocalDate today = LocalDate.now();
        Map<String, Double> daily = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) daily.put(today.minusDays(i).format(dayFmt), 0.0);
        paid.forEach(b -> {
            if (b.getCreatedAt() == null) return;
            LocalDate d = b.getCreatedAt().toLocalDate();
            if (!d.isBefore(today.minusDays(29))) {
                String key = d.format(dayFmt);
                daily.merge(key, b.getPlatformCommission() != null ? b.getPlatformCommission() : 0.0, Double::sum);
            }
        });

        // ── Monthly revenue — last 12 months ──────────────────────────────
        DateTimeFormatter monFmt = DateTimeFormatter.ofPattern("MMM yy");
        Map<String, Double> monthly = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) monthly.put(YearMonth.now().minusMonths(i).format(monFmt), 0.0);
        paid.forEach(b -> {
            if (b.getCreatedAt() == null) return;
            String key = YearMonth.from(b.getCreatedAt()).format(monFmt);
            if (monthly.containsKey(key))
                monthly.merge(key, b.getPlatformCommission() != null ? b.getPlatformCommission() : 0.0, Double::sum);
        });

        // ── Yearly revenue ────────────────────────────────────────────────
        Map<String, Double> yearly = new TreeMap<>();
        paid.forEach(b -> {
            if (b.getCreatedAt() == null) return;
            yearly.merge(String.valueOf(b.getCreatedAt().getYear()),
                b.getPlatformCommission() != null ? b.getPlatformCommission() : 0.0, Double::sum);
        });

        // ── Destination rank (non-cancelled bookings) ─────────────────────
        Map<String, Long> destCount = new HashMap<>();
        all.stream().filter(b -> b.getStatus() != Booking.Status.CANCELLED)
            .filter(b -> b.getDestination() != null && !b.getDestination().isBlank())
            .forEach(b -> {
                for (String d : b.getDestination().split(",\\s*"))
                    if (!d.isBlank()) destCount.merge(d.trim(), 1L, Long::sum);
            });
        Map<String, Long> destRank = destCount.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(8)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        // ── Language rank (approved guides) ──────────────────────────────
        Map<String, Long> langCount = new HashMap<>();
        guideRepo.findAll().stream()
            .filter(g -> g.getStatus() == GuideProfile.Status.APPROVED && g.getLanguages() != null)
            .forEach(g -> g.getLanguages().forEach(lang -> langCount.merge(lang, 1L, Long::sum)));
        Map<String, Long> langRank = langCount.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(8)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        // ── Guide rank (by booking count) ─────────────────────────────────
        Map<Long, AdminAnalyticsResponse.GuideRankEntry> guideMap = new LinkedHashMap<>();
        all.stream().filter(b -> b.getStatus() != Booking.Status.CANCELLED).forEach(b -> {
            Long gId   = b.getGuide().getId();
            String name = b.getGuide().getUser().getFullName();
            double rev = b.getPaymentStatus() == Booking.PaymentStatus.PAID && b.getTotalAmount() != null
                ? b.getTotalAmount() : 0.0;
            guideMap.merge(gId,
                new AdminAnalyticsResponse.GuideRankEntry(name, 1L, rev),
                (e, n) -> new AdminAnalyticsResponse.GuideRankEntry(e.getName(), e.getBookings() + 1, e.getRevenue() + rev));
        });
        List<AdminAnalyticsResponse.GuideRankEntry> guideRank = guideMap.values().stream()
            .sorted(Comparator.comparingLong(AdminAnalyticsResponse.GuideRankEntry::getBookings).reversed())
            .limit(10).collect(Collectors.toList());

        AdminAnalyticsResponse resp = new AdminAnalyticsResponse();
        resp.setDailyRevenue(daily);
        resp.setMonthlyRevenue(monthly);
        resp.setYearlyRevenue(yearly);
        resp.setDestinationRank(destRank);
        resp.setLanguageRank(langRank);
        resp.setGuideRank(guideRank);
        return resp;
    }

    @Transactional
    public GuideProfileResponse setStatus(Long profileId, GuideProfile.Status status) {
        GuideProfile profile = guideRepo.findById(profileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide profile not found"));
        profile.setStatus(status);
        return GuideProfileResponse.from(guideRepo.save(profile));
    }
}
