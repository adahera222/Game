#pragma strict

public interface ILevel {
	function PlaceQuestItem(item: GameObject);
	function GenerateNewLevel();
}