#pragma strict

/// <summary>
/// Contains all of the information and methods for a random game level
/// </summary>
public class Level implements ILevel {
	
	private var _map: IMap;
	private var _levelRenderer: ILevelRenderer;
	
	private var _characterPrefab: GameObject;
	private var _character: GameObject;

	public function Level(map: IMap, render: ILevelRenderer, characterPrefab: GameObject) {
		_map = map;
		_levelRenderer = render;
		_characterPrefab = characterPrefab;
	}
	
	public function GenerateNewLevel() {
		if (_character != null) {
			GameObject.Destroy(_character);
			_character = null;
		}
		
		_map.Reset();
		_map.Generate();
		_levelRenderer.RenderMap(_map);
		
		_character = GameObject.Instantiate(_characterPrefab) as GameObject;
		var script: CharacterHandler = _character.GetComponent(CharacterHandler);
		script.PlaceInMap(_map);
		
		Debug.Log (_map);
	}
	
	public function PlaceQuestItem(item: GameObject) {
		_map.PlaceItemInRandomRoom(item.transform);
	}
	
}