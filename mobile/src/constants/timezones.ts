export interface TimezoneOption {
    city: string;
    region: string;
    zone: string;
}

export const MAJOR_CITY_TIMEZONES: TimezoneOption[] = [
    { city: "London", region: "United Kingdom", zone: "Europe/London" },
    { city: "Dublin", region: "Ireland", zone: "Europe/Dublin" },
    { city: "Paris", region: "France", zone: "Europe/Paris" },
    { city: "Berlin", region: "Germany", zone: "Europe/Berlin" },
    { city: "Madrid", region: "Spain", zone: "Europe/Madrid" },
    { city: "Rome", region: "Italy", zone: "Europe/Rome" },
    { city: "Athens", region: "Greece", zone: "Europe/Athens" },
    { city: "Helsinki", region: "Finland", zone: "Europe/Helsinki" },
    { city: "Istanbul", region: "Turkey", zone: "Europe/Istanbul" },
    { city: "New York", region: "United States", zone: "America/New_York" },
    { city: "Chicago", region: "United States", zone: "America/Chicago" },
    { city: "Denver", region: "United States", zone: "America/Denver" },
    { city: "Los Angeles", region: "United States", zone: "America/Los_Angeles" },
    { city: "Toronto", region: "Canada", zone: "America/Toronto" },
    { city: "Vancouver", region: "Canada", zone: "America/Vancouver" },
    { city: "Mexico City", region: "Mexico", zone: "America/Mexico_City" },
    { city: "Sao Paulo", region: "Brazil", zone: "America/Sao_Paulo" },
    { city: "Buenos Aires", region: "Argentina", zone: "America/Argentina/Buenos_Aires" },
    { city: "Johannesburg", region: "South Africa", zone: "Africa/Johannesburg" },
    { city: "Lagos", region: "Nigeria", zone: "Africa/Lagos" },
    { city: "Nairobi", region: "Kenya", zone: "Africa/Nairobi" },
    { city: "Dubai", region: "United Arab Emirates", zone: "Asia/Dubai" },
    { city: "Riyadh", region: "Saudi Arabia", zone: "Asia/Riyadh" },
    { city: "Mumbai", region: "India", zone: "Asia/Kolkata" },
    { city: "Karachi", region: "Pakistan", zone: "Asia/Karachi" },
    { city: "Bangkok", region: "Thailand", zone: "Asia/Bangkok" },
    { city: "Singapore", region: "Singapore", zone: "Asia/Singapore" },
    { city: "Hong Kong", region: "Hong Kong", zone: "Asia/Hong_Kong" },
    { city: "Shanghai", region: "China", zone: "Asia/Shanghai" },
    { city: "Seoul", region: "South Korea", zone: "Asia/Seoul" },
    { city: "Tokyo", region: "Japan", zone: "Asia/Tokyo" },
    { city: "Sydney", region: "Australia", zone: "Australia/Sydney" },
    { city: "Melbourne", region: "Australia", zone: "Australia/Melbourne" },
    { city: "Auckland", region: "New Zealand", zone: "Pacific/Auckland" },
    { city: "Honolulu", region: "United States", zone: "Pacific/Honolulu" },
    { city: "UTC", region: "Coordinated Universal Time", zone: "UTC" },
];
