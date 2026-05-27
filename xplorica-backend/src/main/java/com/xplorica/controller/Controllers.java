package com.xplorica.controller;

import com.xplorica.dto.*;
import com.xplorica.entity.*;
import com.xplorica.repository.*;
import com.xplorica.security.JwtUtil;
import com.xplorica.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// ─── Auth Controller ──────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}

// ─── Guide Controller ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
class GuideController {

    private final GuideService guideService;

    /** Public — browse all approved guides with optional filters */
    @GetMapping
    public ResponseEntity<List<GuideProfileResponse>> list(
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String destination,
        @RequestParam(required = false) Double minRating
    ) {
        return ResponseEntity.ok(guideService.filterGuides(language, destination, minRating));
    }

    /** Public — get a single guide */
    @GetMapping("/{id}")
    public ResponseEntity<GuideProfileResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(guideService.getById(id));
    }

    /** Guide — create / update own profile */
    @PutMapping("/profile")
    public ResponseEntity<GuideProfileResponse> upsertProfile(
        @AuthenticationPrincipal UserDetails currentUser,
        @Valid @RequestBody GuideProfileRequest req
    ) {
        return ResponseEntity.ok(guideService.upsertProfile(currentUser.getUsername(), req));
    }

    /** Guide — upload profile photo */
    @PostMapping("/profile/photo")
    public ResponseEntity<String> uploadPhoto(
        @AuthenticationPrincipal UserDetails currentUser,
        @RequestParam("photo") MultipartFile file
    ) {
        String url = guideService.uploadPhoto(currentUser.getUsername(), file);
        return ResponseEntity.ok(url);
    }

    /** Tourist — rate a guide (one rating per tourist-guide pair) */
    @PostMapping("/{guideId}/rate")
    public ResponseEntity<Void> rate(
        @AuthenticationPrincipal UserDetails currentUser,
        @PathVariable Long guideId,
        @Valid @RequestBody RatingRequest req
    ) {
        guideService.rateGuide(currentUser.getUsername(), guideId, req);
        return ResponseEntity.ok().build();
    }

    /** Public — get all ratings for a guide */
    @GetMapping("/{guideId}/ratings")
    public ResponseEntity<List<RatingResponse>> ratings(@PathVariable Long guideId) {
        return ResponseEntity.ok(guideService.getRatings(guideId));
    }
}

// ─── Chat Controller ──────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
class ChatController {

    private final ChatService chatService;

    /** Send a message */
    @PostMapping
    public ResponseEntity<MessageResponse> send(
        @AuthenticationPrincipal UserDetails currentUser,
        @Valid @RequestBody MessageRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(chatService.sendMessage(currentUser.getUsername(), req));
    }

    /** Get conversation with a specific user */
    @GetMapping("/{partnerId}")
    public ResponseEntity<List<MessageResponse>> conversation(
        @AuthenticationPrincipal UserDetails currentUser,
        @PathVariable Long partnerId
    ) {
        return ResponseEntity.ok(chatService.getConversation(currentUser.getUsername(), partnerId));
    }

    /** List all users who the current user has chatted with */
    @GetMapping("/partners")
    public ResponseEntity<List<com.xplorica.dto.UserSummaryResponse>> partners(
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return ResponseEntity.ok(chatService.getConversationPartners(currentUser.getUsername()));
    }
}

// ─── Booking Controller ───────────────────────────────────────────────────
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
class BookingController {

    private final BookingService bookingService;

    /** Tourist creates a booking */
    @PostMapping
    public ResponseEntity<BookingResponse> create(
        @AuthenticationPrincipal UserDetails currentUser,
        @Valid @RequestBody BookingRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(bookingService.createBooking(currentUser.getUsername(), req));
    }

    /** Current user's bookings */
    @GetMapping("/mine")
    public ResponseEntity<List<BookingResponse>> mine(
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return ResponseEntity.ok(bookingService.getMyBookings(currentUser.getUsername()));
    }

    /** Confirm payment (mock — just flips paymentStatus to PAID) */
    @PostMapping("/{bookingId}/pay")
    public ResponseEntity<BookingResponse> pay(
        @AuthenticationPrincipal UserDetails currentUser,
        @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(bookingService.confirmPayment(currentUser.getUsername(), bookingId));
    }

    /** Guide confirms/cancels a booking */
    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateStatus(
        @AuthenticationPrincipal UserDetails currentUser,
        @PathVariable Long bookingId,
        @RequestParam Booking.Status status
    ) {
        return ResponseEntity.ok(bookingService.updateStatus(currentUser.getUsername(), bookingId, status));
    }
}

// ─── Privacy Controller ───────────────────────────────────────────────────
@RestController
@RequestMapping("/api/privacy")
class PrivacyController {
    @GetMapping
    public ResponseEntity<String> privacy() {
        return ResponseEntity.ok("Privacy Policy content served here.");
    }
}
