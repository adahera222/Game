#pragma strict

public static class VectorHelper {
	
	/// <summary>
	/// Returns the vector that is closest to the target vector
	/// </summary>
	/// <returns>
	/// The closest vector to the target, from the list of vectors
	/// </returns>
	/// <param name='target'>
	/// Target vector that is being checked
	/// </param>
	/// <param name='vectors'>
	/// an array of vectors to check the target against
	/// </param>
	public function GetClosestVector(target: Vector3, vectors: Vector3[]): Vector3 {
	
		//if no vectors were passed in, return the target
		if (vectors.Length == 0) {
			return target;
		}
		
		//start with the first vector
		var closestVector: Vector3 = vectors[0];
		var smallestAngle: float = Vector3.Angle (target, closestVector);
		
		//if there is only one vector in the array, return it
		if (vectors.Length == 1) {
			return closestVector;
		}
		
		//loop through the rest of the vectors
		for (var i: int = 1; i < vectors.Length; i++) {
			var angle: int = Vector3.Angle(target, vectors[i]);
			if (angle < smallestAngle) {
				closestVector = vectors[i];
				smallestAngle = angle;
			}
		}
		
		//return the closest vector
		return closestVector;
	}
	
}