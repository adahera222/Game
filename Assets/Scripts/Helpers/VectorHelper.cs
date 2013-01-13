using UnityEngine;
using System.Collections;

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
	public static Vector3 GetClosestVector(Vector3 target, params Vector3[] vectors) {
		//if no vectors were passed in, return the target
		if (vectors.Length == 0) {
			return target;
		}
		
		//start with the first vector
		Vector3 closestVector = vectors[0];
		float smallestAngle = Vector3.Angle (target, closestVector);
		
		//if there is only one vector in the array, return it
		if (vectors.Length == 1) {
			return closestVector;
		}
		
		//loop through the rest of the vectors
		for (int i = 1; i < vectors.Length; i++) {
			float angle = Vector3.Angle(target, vectors[i]);
			if (angle < smallestAngle) {
				closestVector = vectors[i];
				smallestAngle = angle;
			}
		}
		
		//return the closest vector
		return closestVector;
	}
	
}
