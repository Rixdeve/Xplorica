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

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepo;
    private final GuideProfileRepository guideRepo;
    private final UserRepository userRepo;

    private static final List<Booking.Status> LIVE_STATUSES =
        List.of(Booking.Status.PENDING, Booking.Status.CONFIRMED);

    @Transactional
    public BookingResponse createBooking(String email, BookingRequest req) {
        User tourist = userRepo.findByEmail(email).orElseThrow();
        GuideProfile guide = guideRepo.findById(req.getGuideId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide not found"));

        if (bookingRepo.existsByGuideIdAndTourDateAndStatusIn(
                guide.getId(), req.getTourDate(), LIVE_STATUSES))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This guide is not available on the selected date");

        Booking b = Booking.builder()
            .tourist(tourist).guide(guide)
            .tourDate(req.getTourDate())
            .numberOfPeople(req.getNumberOfPeople())
            .totalAmount(req.getTotalAmount())
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
            if (status != Booking.Status.CONFIRMED && status != Booking.Status.CANCELLED)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Guide can only accept (CONFIRMED) or reject (CANCELLED) a booking");
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
        r.setTourDate(b.getTourDate());
        r.setNumberOfPeople(b.getNumberOfPeople());
        r.setTotalAmount(b.getTotalAmount());
        r.setStatus(b.getStatus().name());
        r.setPaymentStatus(b.getPaymentStatus().name());
        r.setDestination(b.getDestination());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }
}
