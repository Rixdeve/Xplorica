package com.xplorica.entity;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DestinationItem {

    /** Maps to the existing 'destination' column in guide_destinations table. */
    @Column(name = "destination")
    private String name;

    /** New column — Hibernate adds it via ddl-auto=update. */
    @Column(name = "destination_price")
    private Double price;
}
