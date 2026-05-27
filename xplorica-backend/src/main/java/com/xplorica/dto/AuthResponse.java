package com.xplorica.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String role;
    private Long userId;
    private String fullName;
    private Long guideProfileId; // null if tourist
}
