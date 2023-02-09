export type Rank = "UNRANKED" | "BRONZE" | "SILVER" | "GOLD" | "MASTER_OF_THE_PADDLE";

export function ratio_to_rank(wins: number, losses: number): Rank {
    const total = wins + losses;

    if (total < 10) {
        return "UNRANKED";
    }

    const ratio = wins / total;

    if (ratio >= 0.9) {
        return "MASTER_OF_THE_PADDLE";
    } else if (ratio >= 0.7) {
        return "GOLD";
    } else if (ratio >= 0.5) {
        return "SILVER";
    } else {
        return "BRONZE";
    }
}

export function rank_to_image(rank: Rank): string {
    if (rank == "UNRANKED") {
        return "/rank-unranked.png";
    } else if (rank == "BRONZE") {
        return "/rank-bronze.png";
    } else if (rank == "SILVER") {
        return "/rank-silver.png";
    } else if (rank == "GOLD") {
        return "/rank-gold.png";
    } else if (rank == "MASTER_OF_THE_PADDLE") {
        return "/rank-motp.png";
    } else {
        throw "invalid rank";
    }
}
