package com.xplorica.service;

import com.xplorica.dto.GuideProfileRequest;
import com.xplorica.dto.GuideProfileResponse;
import com.xplorica.dto.RatingRequest;
import com.xplorica.dto.RatingResponse;
import com.xplorica.entity.GuideProfile;
import com.xplorica.entity.Rating;
import com.xplorica.entity.User;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuideService {

    private final GuideProfileRepository guideRepo;
    private final UserRepository userRepo;
    private final RatingRepository ratingRepo;

    @Value("${app.upload.dir}")
    private String uploadDir;

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

        profile.setDescription(req.getDescription());
        profile.setLicenseNumber(req.getLicenseNumber());
        profile.setYearsExperience(req.getYearsExperience());
        profile.setLanguages(req.getLanguages());
        profile.setDestinations(req.getDestinations());
        if (profile.getStatus() == null) profile.setStatus(GuideProfile.Status.APPROVED);

        return GuideProfileResponse.from(guideRepo.save(profile));
    }

    public String uploadPhoto(String email, MultipartFile file) {
        try {
            User user = userRepo.findByEmail(email).orElseThrow();
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = "guide_" + user.getId() + "_" + System.currentTimeMillis()
                + getExtension(file.getOriginalFilename());
            Files.copy(file.getInputStream(), dir.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);
            String url = "/uploads/" + filename;
            GuideProfile profile = guideRepo.findByUserId(user.getId()).orElseThrow();
            profile.setPhotoUrl(url);
            guideRepo.save(profile);
            return url;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload failed");
        }
    }

    @Transactional
    public void rateGuide(String email, Long guideId, RatingRequest req) {
        User tourist = userRepo.findByEmail(email).orElseThrow();
        GuideProfile guide = guideRepo.findById(guideId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
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
        return ratingRepo.findByGuideIdOrderByCreatedAtDesc(guideId).stream().map(r -> {
            RatingResponse res = new RatingResponse();
            res.setId(r.getId());
            res.setTouristName(r.getTourist().getFullName());
            res.setStars(r.getStars());
            res.setComment(r.getComment());
            res.setCreatedAt(r.getCreatedAt());
            return res;
        }).toList();
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
