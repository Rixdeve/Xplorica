package com.xplorica.dto;

import com.xplorica.entity.GuideProfile;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GuideProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String photoUrl;
    private String description;
    private String licenseNumber;
    private Integer yearsExperience;
    private List<String> languages;
    private List<String> destinations;
    private Double dailyRate;
    private Double averageRating;
    private Integer totalRatings;
    private GuideProfile.Status status;
    private boolean premium;
    private LocalDateTime premiumExpiresAt;

    public static GuideProfileResponse from(GuideProfile g) {
        GuideProfileResponse r = new GuideProfileResponse();
        r.id = g.getId();
        r.userId = g.getUser().getId();
        r.fullName = g.getUser().getFullName();
        r.photoUrl = g.getPhotoUrl();
        r.description = g.getDescription();
        r.licenseNumber = g.getLicenseNumber();
        r.yearsExperience = g.getYearsExperience();
        r.languages = g.getLanguages();
        r.destinations = g.getDestinations();
        r.dailyRate = g.getDailyRate();
        r.averageRating = g.getAverageRating();
        r.totalRatings = g.getTotalRatings();
        r.status = g.getStatus();
        r.premium = g.isEffectivelyPremium();
        r.premiumExpiresAt = g.getPremiumExpiresAt();
        return r;
    }
}
