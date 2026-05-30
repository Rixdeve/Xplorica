package com.xplorica.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourist_id", nullable = false)
    private User tourist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    private GuideProfile guide;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer numberOfPeople;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    private Double serviceFee;

    @Column(nullable = false)
    private Double platformCommission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @Column
    private String destination;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Status { PENDING, CONFIRMED, COMPLETED, CANCELLED }
    public enum PaymentStatus { PENDING, PAID, REFUNDED }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = Status.PENDING;
        if (paymentStatus == null) paymentStatus = PaymentStatus.PENDING;
        if (platformCommission == null) platformCommission = 0.0;
    }
}
