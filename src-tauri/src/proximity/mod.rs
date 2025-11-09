use crate::agents::Position;

pub fn calculate_distance(pos1: &Position, pos2: &Position) -> f32 {
    let dx = (pos1.x as f32) - (pos2.x as f32);
    let dy = (pos1.y as f32) - (pos2.y as f32);
    (dx * dx + dy * dy).sqrt()
}

pub fn is_in_proximity(pos1: &Position, pos2: &Position, radius: f32) -> bool {
    calculate_distance(pos1, pos2) <= radius
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_distance_calculation() {
        let pos1 = Position { x: 0, y: 0 };
        let pos2 = Position { x: 3, y: 4 };
        assert_eq!(calculate_distance(&pos1, &pos2), 5.0);
    }

    #[test]
    fn test_proximity_detection() {
        let pos1 = Position { x: 0, y: 0 };
        let pos2 = Position { x: 3, y: 4 };
        assert!(is_in_proximity(&pos1, &pos2, 5.0));
        assert!(!is_in_proximity(&pos1, &pos2, 4.0));
    }
}
