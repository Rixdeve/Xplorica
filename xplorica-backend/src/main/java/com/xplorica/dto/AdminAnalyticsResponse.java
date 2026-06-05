package com.xplorica.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
public class AdminAnalyticsResponse {
    private Map<String, Double> dailyRevenue;
    private Map<String, Double> monthlyRevenue;
    private Map<String, Double> yearlyRevenue;
    private Map<String, Long>   destinationRank;
    private Map<String, Long>   languageRank;
    private List<GuideRankEntry> guideRank;
    private int    activePremiumGuides;
    private double estimatedPremiumRevenue;
    private double totalPremiumAllTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuideRankEntry {
        private String name;
        private long   bookings;
        private double revenue;
    }
}
