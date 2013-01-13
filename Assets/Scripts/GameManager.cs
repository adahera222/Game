using UnityEngine;
using System.Collections;

public class GameManager : MonoBehaviour {
	
	public GameObject characterPrefab;
	public GameObject objectPrefab;
	
	private ILevel GameLevel;
	
	// Use this for initialization
	void Start () {
		GameLevel = new Level(new SnakeMap(), new StoneHallRenderer(), characterPrefab);
	}
	
	void OnGUI () {
    	if (GUI.Button (new Rect (10,10,75,25), "Generate")) {
			GameLevel.GenerateNewLevel();
		}
    	if (GUI.Button (new Rect (95,10,75,25), "Item")) {
			GameObject item = GameObject.Instantiate(objectPrefab) as GameObject;
			GameLevel.PlaceQuestItem(item);
		}		
	}	

}
