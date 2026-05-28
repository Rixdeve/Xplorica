package com.xplorica.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RatingResponse {
    private Long id;
    private String touristName;
    private String guideName;
    private Integer stars;
    private String comment;
    private LocalDateTime createdAt;
}
