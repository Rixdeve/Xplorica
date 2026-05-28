package com.xplorica.repository;

import com.xplorica.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);
    List<Booking> findByGuideIdOrderByCreatedAtDesc(Long guideId);

    /** True if the tourist has a non-cancelled booking with the given guide (by guide's user ID) */
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.tourist.id = :touristId
          AND b.guide.user.id = :guideUserId
          AND b.status <> com.xplorica.entity.Booking.Status.CANCELLED
        """)
    boolean hasActiveBooking(@Param("touristId") Long touristId,
                             @Param("guideUserId") Long guideUserId);
}
