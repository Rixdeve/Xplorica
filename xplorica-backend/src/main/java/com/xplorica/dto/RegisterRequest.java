package com.xplorica.dto;

import com.xplorica.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6)
    private String password;
    @NotNull
    private User.Role role;  // TOURIST or GUIDE

    // Guide-specific fields
    @Positive
    private Double dailyRate; // required when role = GUIDE
    private String description;
    private String licenseNumber;
    private Integer yearsExperience;
    private List<String> languages;
    private List<String> destinations;
}
