package com.xplorica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RatingRequest {
    @NotNull @Min(1) @Max(5)
    private Integer stars;
    private String comment;
}
