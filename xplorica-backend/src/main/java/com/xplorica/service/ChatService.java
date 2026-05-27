package com.xplorica.service;

import com.xplorica.dto.MessageRequest;
import com.xplorica.dto.MessageResponse;
import com.xplorica.dto.UserSummaryResponse;
import com.xplorica.entity.ChatMessage;
import com.xplorica.entity.User;
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

    @Transactional
    public MessageResponse sendMessage(String senderEmail, MessageRequest req) {
        User sender = userRepo.findByEmail(senderEmail).orElseThrow();
        User receiver = userRepo.findById(req.getReceiverId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));

        ChatMessage msg = ChatMessage.builder()
            .sender(sender).receiver(receiver).content(req.getContent()).build();
        chatRepo.save(msg);
        return toResponse(msg);
    }

    public List<MessageResponse> getConversation(String email, Long partnerId) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return chatRepo.findConversation(user.getId(), partnerId)
            .stream().map(this::toResponse).toList();
    }

    public List<UserSummaryResponse> getConversationPartners(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return chatRepo.findConversationPartners(user.getId()).stream()
            .map(u -> new UserSummaryResponse(u.getId(), u.getFullName()))
            .toList();
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
