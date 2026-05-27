package com.xplorica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull
    private Long guideId;
    @NotNull
    private LocalDate tourDate;
    @NotNull @Min(1)
    private Integer numberOfPeople;
    @NotNull @Positive
    private Double totalAmount;
    private String destination;
}
