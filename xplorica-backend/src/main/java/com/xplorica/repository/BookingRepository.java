package com.xplorica.repository;

import com.xplorica.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);
    List<Booking> findByGuideIdOrderByCreatedAtDesc(Long guideId);

    /** Availability check — true if guide already has a live booking on that date */
    boolean existsByGuideIdAndTourDateAndStatusIn(
        Long guideId, LocalDate tourDate, Collection<Booking.Status> statuses);

    boolean existsByTouristIdAndGuideUserIdAndStatusNot(
        Long touristId, Long guideUserId, Booking.Status status);

    default boolean hasActiveBooking(Long touristId, Long guideUserId) {
        return existsByTouristIdAndGuideUserIdAndStatusNot(
            touristId, guideUserId, Booking.Status.CANCELLED);
    }
}
