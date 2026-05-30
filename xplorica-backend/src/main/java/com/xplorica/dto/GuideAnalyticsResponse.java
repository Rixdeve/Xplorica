package com.xplorica.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

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
    // monthly data for charts (last 6 months, ordered)
    private Map<String, Double>  monthlyRevenue;
    private Map<String, Integer> monthlyTours;
    // per-destination booking counts (sorted by count desc)
    private Map<String, Integer> destinationBookings;
}
