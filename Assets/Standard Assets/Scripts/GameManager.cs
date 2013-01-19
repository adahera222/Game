using UnityEngine;
using System.Collections;

public class GameManager : MonoBehaviour {
	
	public GameObject characterPrefab;
	
	private ILevel GameLevel;
	
	// Use this for initialization
	void Start () {
		GameLevel = new Level(new SnakeMap(), new StoneHallRenderer(), characterPrefab);
	}
	
	void OnGUI () {
    	if (GUI.Button (new Rect (10,10,75,25), "Generate")) {
			GameLevel.GenerateNewLevel();
		}		
	}	

}
