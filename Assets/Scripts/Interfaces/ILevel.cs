using UnityEngine;
using System.Collections;

public interface ILevel {
	void PlaceQuestItem(GameObject item);
	void GenerateNewLevel();
	void CheckMovePath(Vector2 fromCell, Vector2 toCell);
}
