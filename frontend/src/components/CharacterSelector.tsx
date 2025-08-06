import React, { useEffect } from 'react'
import styles from '../styles/CharacterSelector.module.css'
import { useCharacterStore, useAvailableCharacters, useCharacterLoading, useCharacterUpdating } from '../stores/characterStore'
import { CharacterDisplay } from './CharacterDisplay'

interface CharacterSelectorProps {
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
  className?: string
  showLevels?: boolean
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedCharacter,
  onCharacterSelect,
  className = '',
  showLevels = true
}) => {
  const { loadCharacters, updateCharacter } = useCharacterStore()
  const availableCharacters = useAvailableCharacters()
  const isLoading = useCharacterLoading()
  const isUpdating = useCharacterUpdating()

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const handleCharacterSelect = async (characterId: string) => {
    const success = await updateCharacter(characterId)
    if (success) {
      onCharacterSelect(characterId)
    }
  }

  if (isLoading) {
    return (
      <div className={`${styles.characterSelector} ${className}`.trim()}>
        <div className={styles.loading}>Loading characters...</div>
      </div>
    )
  }

  return (
    <div className={`${styles.characterSelector} ${className}`.trim()}>
      <label className={styles.label}>Choose Your Character</label>
      <p className={styles.description}>
        Select a university-themed character to represent you in the game
      </p>
      
      <div className={styles.characterGrid}>
        {availableCharacters.map((character) => (
          <button
            key={character.id}
            className={
              selectedCharacter === character.id 
                ? `${styles.characterButton} ${styles.selected}` 
                : styles.characterButton
            }
            onClick={() => handleCharacterSelect(character.id)}
            type="button"
            title={character.description}
            disabled={isUpdating}
            data-testid={`character-${character.id}`}
          >
            {showLevels ? (
              <CharacterDisplay
                character={character}
                level={1} // Default level for selection
                size="small"
                showLevel={true}
                showProgress={false}
              />
            ) : (
              <>
                <span className={styles.characterEmoji}>{character.emoji}</span>
                <span className={styles.characterName}>{character.name}</span>
              </>
            )}
          </button>
        ))}
      </div>
      
      {isUpdating && (
        <div className={styles.updating}>Updating character...</div>
      )}
    </div>
  )
} 