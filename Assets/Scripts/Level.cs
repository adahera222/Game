using UnityEngine;
using System.Collections;
using System;

/// <summary>
/// Contains all of the information and methods for a random game level
/// </summary>
public class Level : ILevel {
	
	private IMap _map;
	private ILevelRenderer _levelRenderer;
	
	private GameObject _characterPrefab;
	private GameObject _character;

	public Level(IMap map, ILevelRenderer render, GameObject characterPrefab) {
		_map = map;
		_levelRenderer = render;
		_characterPrefab = characterPrefab;
	}
	
	public void GenerateNewLevel() {
		if (_character != null) {
			GameObject.Destroy(_character);
			_character = null;
		}
		
		_map.Reset();
		_map.Generate();
		_levelRenderer.RenderMap(_map);
		
		_character = GameObject.Instantiate(_characterPrefab) as GameObject;
		CharacterHandler script = _character.GetComponent<CharacterHandler>();
		script.PlaceInMap(_map);
		
		Debug.Log (_map);
	}
	
	public void CheckMovePath(Vector2 fromCell, Vector2 toCell) {
	}
	
	public void PlaceQuestItem(GameObject item) {
	}
	
}
