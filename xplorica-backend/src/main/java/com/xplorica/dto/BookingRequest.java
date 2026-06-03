package com.xplorica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull
    private Long guideId;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    @NotNull @Min(1)
    private Integer numberOfPeople;
    /** Ignored — total is computed server-side from destination prices × days. */
    private Double totalAmount;
    private String destination;
}
