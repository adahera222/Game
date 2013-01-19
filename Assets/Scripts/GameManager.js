#pragma strict

public class GameManager extends MonoBehaviour {

	public var characterPrefab: GameObject;
	
	private var GameLevel: ILevel;
	
	// Use this for initialization
	function Start () {
		GameLevel = new Level(new SnakeMap(), new StoneHallRenderer(), characterPrefab);
	}
	
	function OnGUI () {
    	if (GUI.Button (new Rect (10,10,75,25), "Generate")) {
			GameLevel.GenerateNewLevel();
		}		
	}

}