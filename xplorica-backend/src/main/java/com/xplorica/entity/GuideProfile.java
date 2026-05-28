package com.xplorica.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "guide_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String photoUrl;

    @Column
    private String licenseNumber;

    @Column
    private Integer yearsExperience;

    @ElementCollection
    @CollectionTable(name = "guide_languages", joinColumns = @JoinColumn(name = "guide_id"))
    @Column(name = "language")
    private List<String> languages;

    @ElementCollection
    @CollectionTable(name = "guide_destinations", joinColumns = @JoinColumn(name = "guide_id"))
    @Column(name = "destination")
    private List<String> destinations;

    @Column
    private Double dailyRate;

    @Column(nullable = false, columnDefinition = "DOUBLE DEFAULT 0")
    private Double averageRating;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer totalRatings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }

    @PrePersist
    protected void init() {
        if (averageRating == null) averageRating = 0.0;
        if (totalRatings == null) totalRatings = 0;
        if (status == null) status = Status.APPROVED;
    }

    // Recalculate average when a new rating is added
    public void addRating(double newRating) {
        double totalScore = this.averageRating * this.totalRatings + newRating;
        this.totalRatings++;
        this.averageRating = Math.round((totalScore / this.totalRatings) * 10.0) / 10.0;
    }
}
