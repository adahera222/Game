using UnityEngine;
using System.Collections;

public interface ILevel {
	void PlaceQuestItem(GameObject item);
	void GenerateNewLevel();
}
