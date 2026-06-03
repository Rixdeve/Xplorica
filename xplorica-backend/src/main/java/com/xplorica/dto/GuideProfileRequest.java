package com.xplorica.dto;

import com.xplorica.entity.DestinationItem;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class GuideProfileRequest {
    @NotBlank
    private String description;
    private String licenseNumber;
    @Min(0) @Max(60)
    private Integer yearsExperience;
    @NotEmpty
    private List<String> languages;
    @NotEmpty
    private List<DestinationItem> destinations;

    @Positive
    private Double dailyRate;
}
