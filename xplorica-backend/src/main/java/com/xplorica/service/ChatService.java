package com.xplorica.service;

import com.xplorica.dto.MessageRequest;
import com.xplorica.dto.MessageResponse;
import com.xplorica.dto.UserSummaryResponse;
import com.xplorica.entity.ChatMessage;
import com.xplorica.entity.User;
import com.xplorica.repository.BookingRepository;
import com.xplorica.repository.ChatMessageRepository;
import com.xplorica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatRepo;
    private final UserRepository userRepo;
    private final BookingRepository bookingRepo;

    @Transactional
    public MessageResponse sendMessage(String senderEmail, MessageRequest req) {
        User sender = userRepo.findByEmail(senderEmail).orElseThrow();
        User receiver = userRepo.findById(req.getReceiverId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));

        requireBookingBetween(sender, receiver);

        ChatMessage msg = ChatMessage.builder()
            .sender(sender).receiver(receiver).content(req.getContent()).build();
        chatRepo.save(msg);
        return toResponse(msg);
    }

    public List<MessageResponse> getConversation(String email, Long partnerId) {
        User user = userRepo.findByEmail(email).orElseThrow();
        User partner = userRepo.findById(partnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        requireBookingBetween(user, partner);

        return chatRepo.findConversation(user.getId(), partnerId)
            .stream().map(this::toResponse).toList();
    }

    /**
     * Returns conversation partners filtered to only users with whom a booking exists.
     * Guides see their tourists; tourists see their guides.
     */
    public List<UserSummaryResponse> getConversationPartners(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return chatRepo.findConversationPartners(user.getId()).stream()
            .filter(partner -> hasBooking(user, partner))
            .map(u -> new UserSummaryResponse(u.getId(), u.getFullName()))
            .toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void requireBookingBetween(User u1, User u2) {
        if (!hasBooking(u1, u2))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Chat is only available between a tourist and a guide they have booked");
    }

    private boolean hasBooking(User u1, User u2) {
        User tourist = u1.getRole() == User.Role.TOURIST ? u1 : u2;
        User guide   = u1.getRole() == User.Role.GUIDE   ? u1 : u2;
        if (tourist.getRole() != User.Role.TOURIST || guide.getRole() != User.Role.GUIDE)
            return false;
        return bookingRepo.hasActiveBooking(tourist.getId(), guide.getId());
    }

    private MessageResponse toResponse(ChatMessage m) {
        MessageResponse r = new MessageResponse();
        r.setId(m.getId());
        r.setSenderId(m.getSender().getId());
        r.setSenderName(m.getSender().getFullName());
        r.setReceiverId(m.getReceiver().getId());
        r.setContent(m.getContent());
        r.setSentAt(m.getSentAt());
        r.setIsRead(m.getIsRead());
        return r;
    }
}
