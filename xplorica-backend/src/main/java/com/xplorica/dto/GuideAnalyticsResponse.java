package com.xplorica.dto;

import lombok.Data;
import java.util.List;

@Data
public class GuideAnalyticsResponse {
    private int totalBookings;
    private int completedTours;
    private int confirmedBookings;
    private int pendingBookings;
    private int cancelledBookings;
    private double totalRevenue;
    private double averageRating;
    private int totalReviews;
    private int uniqueTourists;
    private int totalPeopleServed;
    private List<String> topDestinations;
}
