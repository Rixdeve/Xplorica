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

    @Transactional
    public BookingResponse createBooking(String email, BookingRequest req) {
        User tourist = userRepo.findByEmail(email).orElseThrow();
        GuideProfile guide = guideRepo.findById(req.getGuideId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
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

    @Transactional
    public BookingResponse confirmPayment(String email, Long bookingId) {
        Booking b = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        b.setPaymentStatus(Booking.PaymentStatus.PAID);
        b.setStatus(Booking.Status.CONFIRMED);
        return toResponse(bookingRepo.save(b));
    }

    @Transactional
    public BookingResponse updateStatus(String email, Long bookingId, Booking.Status status) {
        Booking b = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        b.setStatus(status);
        return toResponse(bookingRepo.save(b));
    }

    private BookingResponse toResponse(Booking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
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
