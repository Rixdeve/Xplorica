package com.xplorica.repository;

import com.xplorica.entity.GuideProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuideProfileRepository extends JpaRepository<GuideProfile, Long> {
    Optional<GuideProfile> findByUserId(Long userId);

    List<GuideProfile> findByStatusOrderByIdDesc(GuideProfile.Status status);

    List<GuideProfile> findAllByOrderByIdDesc();

    @Query("""
        SELECT DISTINCT g FROM GuideProfile g
         LEFT JOIN g.languages lang
         LEFT JOIN g.destinations dest
        WHERE g.status = 'APPROVED'
          AND (:language IS NULL OR LOWER(lang) LIKE LOWER(CONCAT('%', :language, '%')))
          AND (:destination IS NULL OR LOWER(dest.name) LIKE LOWER(CONCAT('%', :destination, '%')))
          AND (:minRating IS NULL OR g.averageRating >= :minRating)
        ORDER BY g.averageRating DESC
        """)
    List<GuideProfile> filterGuides(
        @Param("language") String language,
        @Param("destination") String destination,
        @Param("minRating") Double minRating
    );
}
