package com.xplorica.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Long id;
    private Long guideProfileId;
    private Long touristId;
    private String guideName;
    private String touristName;
    private LocalDate tourDate;
    private Integer numberOfPeople;
    private Double totalAmount;
    private String status;
    private String paymentStatus;
    private String destination;
    private LocalDateTime createdAt;
}
