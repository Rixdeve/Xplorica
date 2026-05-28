package com.xplorica.repository;

import com.xplorica.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    boolean existsByTouristIdAndGuideId(Long touristId, Long guideId);
    List<Rating> findByGuideIdOrderByCreatedAtDesc(Long guideId);
    List<Rating> findTop9ByOrderByCreatedAtDesc();
}
