package com.xplorica.repository;

import com.xplorica.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);
    List<Booking> findByGuideIdOrderByCreatedAtDesc(Long guideId);

    boolean existsByTouristIdAndGuideUserIdAndStatusNot(
        Long touristId, Long guideUserId, Booking.Status status);

    default boolean hasActiveBooking(Long touristId, Long guideUserId) {
        return existsByTouristIdAndGuideUserIdAndStatusNot(
            touristId, guideUserId, Booking.Status.CANCELLED);
    }
}
