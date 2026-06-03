package com.xplorica.service;

import com.xplorica.dto.GuideProfileResponse;
import com.xplorica.entity.GuideProfile;
import com.xplorica.repository.GuideProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final GuideProfileRepository guideRepo;

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

    @Transactional
    public GuideProfileResponse setStatus(Long profileId, GuideProfile.Status status) {
        GuideProfile profile = guideRepo.findById(profileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guide profile not found"));
        profile.setStatus(status);
        return GuideProfileResponse.from(guideRepo.save(profile));
    }
}
