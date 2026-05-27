package com.xplorica.repository;

import com.xplorica.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);
    List<Booking> findByGuideIdOrderByCreatedAtDesc(Long guideId);
}
