package com.xplorica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MessageRequest {
    @NotNull
    private Long receiverId;
    @NotBlank
    private String content;
}
