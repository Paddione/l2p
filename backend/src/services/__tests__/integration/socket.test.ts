import { io as Client } from 'socket.io-client'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { app } from '../../server'
import { DatabaseService } from '../../services/DatabaseService'

describe('WebSocket Server', () => {
  let io: Server
  let httpServer: any
  let clientSocket: any
  const db = DatabaseService.getInstance()

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer(app)
    io = new Server(httpServer)
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        resolve()
      })
    })
  })

  afterAll(async () => {
    await db.close()
    io.close()
    httpServer.close()
  })

  beforeEach(async () => {
    // Clean up database
    await db.query('DELETE FROM lobbies')
    await db.query('DELETE FROM users')
    
    // Create test client
    const port = (httpServer.address() as any).port
    clientSocket = Client(`http://localhost:${port}`)
    
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        resolve()
      })
    })
  })

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
  })

  describe('Connection', () => {
    it('should connect successfully', () => {
      expect(clientSocket.connected).toBe(true)
    })

    it('should emit connection event', (done) => {
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true)
        done()
      })
    })

    it('should handle disconnection', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false)
        done()
      })
      
      clientSocket.disconnect()
    })
  })

  describe('Lobby Events', () => {
    it('should create lobby successfully', (done) => {
      const lobbyData = {
        playerData: {
          username: 'testuser',
          character: 'player1'
        },
        settings: {
          questionCount: 10
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        expect(data).toHaveProperty('lobby')
        expect(data.lobby).toHaveProperty('code')
        expect(data.lobby.code).toHaveLength(6)
        expect(data.lobby).toHaveProperty('hostId')
        expect(data.players).toHaveLength(1)
        expect(data.players[0]).toHaveProperty('username', 'testuser')
        done()
      })
    })

    it('should join existing lobby', (done) => {
      // First create a lobby
      const createData = {
        playerData: {
          username: 'host',
          character: 'player1'
        },
        settings: {
          questionCount: 10
        }
      }

      clientSocket.emit('lobby:create', createData)

      clientSocket.on('lobby:created', (data: any) => {
        const lobbyCode = data.lobby.code
        
        // Join the lobby with second client
        const secondClient = Client(`http://localhost:${(httpServer.address() as any).port}`)
        
        secondClient.on('connect', () => {
          const joinData = {
            lobbyCode,
            playerData: {
              username: 'player2',
              character: 'player2'
            }
          }

          secondClient.emit('lobby:join', joinData)

          secondClient.on('lobby:joined', (joinResponse) => {
            expect(joinResponse).toHaveProperty('lobby')
            expect(joinResponse.lobby.code).toBe(lobbyCode)
            expect(joinResponse.players).toHaveLength(2)
            secondClient.disconnect()
            done()
          })
        })
      })
    })

    it('should handle player ready state', (done) => {
      const lobbyData = {
        playerData: {
          username: 'testuser',
          character: 'player1'
        },
        settings: {
          questionCount: 10
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        const readyData = {
          isReady: true
        }

        clientSocket.emit('lobby:ready', readyData)

        clientSocket.on('lobby:player_ready', (readyResponse: any) => {
          expect(readyResponse).toHaveProperty('playerId')
          expect(readyResponse).toHaveProperty('isReady', true)
          done()
        })
      })
    })

    it('should handle player leaving', (done) => {
      const lobbyData = {
        playerData: {
          username: 'testuser',
          character: 'player1'
        },
        settings: {
          questionCount: 10
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        clientSocket.disconnect()

        // Create new client to observe the leave event
        const observerClient = Client(`http://localhost:${(httpServer.address() as any).port}`)
        
        observerClient.on('connect', () => {
          observerClient.emit('lobby:join', {
            lobbyCode: data.lobby.code,
            playerData: {
              username: 'observer',
              character: 'player2'
            }
          })

          observerClient.on('lobby:player_left', (leaveData) => {
            expect(leaveData).toHaveProperty('playerId')
            observerClient.disconnect()
            done()
          })
        })
      })
    })
  })

  describe('Game Events', () => {
    let lobbyCode: string
    let hostSocket: any

    beforeEach(async () => {
      // Create lobby for game tests
      hostSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
      
      await new Promise<void>((resolve) => {
        hostSocket.on('connect', () => {
          hostSocket.emit('lobby:create', {
            playerData: {
              username: 'host',
              character: 'player1'
            },
            settings: {
              questionCount: 5
            }
          })

          hostSocket.on('lobby:created', (data: any) => {
            lobbyCode = data.lobby.code
            resolve()
          })
        })
      })
    })

    afterEach(() => {
      if (hostSocket.connected) {
        hostSocket.disconnect()
      }
    })

    it('should start game successfully', (done) => {
      hostSocket.emit('lobby:start_game')

      hostSocket.on('lobby:game_started', (data: any) => {
        expect(data).toHaveProperty('gameData')
        expect(data.gameData).toHaveProperty('question')
        expect(data.gameData).toHaveProperty('timeRemaining')
        expect(data.gameData.timeRemaining).toBe(60)
        done()
      })
    })

    it('should handle answer submission', (done) => {
      hostSocket.emit('lobby:start_game')

      hostSocket.on('lobby:game_started', () => {
        hostSocket.emit('game:answer', {
          answerIndex: 0
        })

        hostSocket.on('game:answer_result', (data: any) => {
          expect(data).toHaveProperty('playerId')
          expect(data).toHaveProperty('answerIndex', 0)
          expect(data).toHaveProperty('isCorrect')
          done()
        })
      })
    })

    it('should handle time up event', (done) => {
      hostSocket.emit('lobby:start_game')

      hostSocket.on('lobby:game_started', () => {
        // Simulate time up
        setTimeout(() => {
          hostSocket.on('game:time_up', () => {
            done()
          })
        }, 100)
      })
    })

    it('should handle score updates', (done) => {
      hostSocket.emit('lobby:start_game')

      hostSocket.on('lobby:game_started', () => {
        hostSocket.emit('game:answer', {
          answerIndex: 0
        })

        hostSocket.on('game:score_update', (data: any) => {
          expect(data).toHaveProperty('playerId')
          expect(data).toHaveProperty('score')
          expect(data).toHaveProperty('multiplier')
          done()
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid lobby code', (done) => {
      clientSocket.emit('lobby:join', {
        lobbyCode: 'INVALID',
        playerData: {
          username: 'testuser',
          character: 'player1'
        }
      })

      clientSocket.on('error', (data: any) => {
        expect(data).toHaveProperty('message')
        expect(data.message).toContain('Lobby not found')
        done()
      })
    })

    it('should handle full lobby', (done) => {
      // Create lobby with 8 players
      const createData = {
        playerData: {
          username: 'host',
          character: 'player1'
        },
        settings: {
          questionCount: 10
        }
      }

      clientSocket.emit('lobby:create', createData)

      clientSocket.on('lobby:created', async (data: any) => {
        const lobbyCode = data.lobby.code
        
        // Add 7 more players
        const promises: Promise<void>[] = []
        for (let i = 1; i < 8; i++) {
          const playerSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
          
          promises.push(new Promise<void>((resolve) => {
            playerSocket.on('connect', () => {
              playerSocket.emit('lobby:join', {
                lobbyCode,
                playerData: {
                  username: `player${i}`,
                  character: `player${i}`
                }
              })

              playerSocket.on('lobby:joined', () => {
                resolve()
              })
            })
          }))
        }

        await Promise.all(promises)

        // Try to join with 9th player
        const ninthPlayer = Client(`http://localhost:${(httpServer.address() as any).port}`)
        
        ninthPlayer.on('connect', () => {
          ninthPlayer.emit('lobby:join', {
            lobbyCode,
            playerData: {
              username: 'player9',
              character: 'player9'
            }
          })

          ninthPlayer.on('error', (data: any) => {
            expect(data).toHaveProperty('message')
            expect(data.message).toContain('Lobby is full')
            ninthPlayer.disconnect()
            done()
          })
        })
      })
    })
  });

  describe('Connection Recovery and Synchronization', () => {
    it('should handle connection interruption and recovery', (done) => {
      const lobbyData = {
        playerData: {
          username: 'recoveryuser',
          character: 'player1'
        },
        settings: {
          questionCount: 5
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        const lobbyCode = data.lobby.code
        
        // Simulate connection interruption
        clientSocket.disconnect()
        
        // Reconnect after a short delay
        setTimeout(() => {
          const newSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
          
          newSocket.on('connect', () => {
            newSocket.emit('lobby:join', {
              lobbyCode,
              playerData: {
                username: 'recoveryuser',
                character: 'player1'
              }
            })

            newSocket.on('lobby:joined', (joinData: any) => {
              expect(joinData).toHaveProperty('lobby')
              expect(joinData.lobby).toHaveProperty('code', lobbyCode)
              newSocket.disconnect()
              done()
            })
          })
        }, 100)
      })
    });

    it('should synchronize state after reconnection', (done) => {
      const lobbyData = {
        playerData: {
          username: 'syncuser',
          character: 'player1'
        },
        settings: {
          questionCount: 3
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        const lobbyCode = data.lobby.code
        
        // Start game
        clientSocket.emit('lobby:start_game')
        
        clientSocket.on('lobby:game_started', () => {
          // Simulate disconnection during game
          clientSocket.disconnect()
          
          // Reconnect and verify state synchronization
          setTimeout(() => {
            const newSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
            
            newSocket.on('connect', () => {
              newSocket.emit('lobby:join', {
                lobbyCode,
                playerData: {
                  username: 'syncuser',
                  character: 'player1'
                }
              })

              newSocket.on('lobby:joined', (joinData: any) => {
                expect(joinData).toHaveProperty('gameState')
                expect(joinData.gameState).toHaveProperty('status')
                newSocket.disconnect()
                done()
              })
            })
          }, 100)
        })
      })
    });
  });

  describe('Performance Under Concurrent Connections', () => {
    it('should handle multiple concurrent lobby creations', (done) => {
      const concurrentSockets = 10
      const sockets: any[] = []
      let completedCreations = 0

      // Create multiple sockets
      for (let i = 0; i < concurrentSockets; i++) {
        const socket = Client(`http://localhost:${(httpServer.address() as any).port}`)
        sockets.push(socket)
        
        socket.on('connect', () => {
          socket.emit('lobby:create', {
            playerData: {
              username: `user${i}`,
              character: `player${i}`
            },
            settings: {
              questionCount: 5
            }
          })

          socket.on('lobby:created', (data: any) => {
            expect(data).toHaveProperty('lobby')
            expect(data.lobby).toHaveProperty('code')
            completedCreations++
            
            if (completedCreations === concurrentSockets) {
              // Clean up
              sockets.forEach(s => s.disconnect())
              done()
            }
          })
        })
      }
    }, 10000);

    it('should handle concurrent message broadcasting', (done) => {
      const playerCount = 8
      const sockets: any[] = []
      let joinedPlayers = 0
      let receivedMessages = 0

      // Create host
      const hostSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
      
      hostSocket.on('connect', () => {
        hostSocket.emit('lobby:create', {
          playerData: {
            username: 'host',
            character: 'host'
          },
          settings: {
            questionCount: 5
          }
        })

        hostSocket.on('lobby:created', (data: any) => {
          const lobbyCode = data.lobby.code
          
          // Add players concurrently
          for (let i = 0; i < playerCount; i++) {
            const playerSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
            sockets.push(playerSocket)
            
            playerSocket.on('connect', () => {
              playerSocket.emit('lobby:join', {
                lobbyCode,
                playerData: {
                  username: `player${i}`,
                  character: `player${i}`
                }
              })

              playerSocket.on('lobby:joined', () => {
                joinedPlayers++
                
                if (joinedPlayers === playerCount) {
                  // Broadcast message to all players
                  hostSocket.emit('lobby:broadcast', {
                    message: 'Test broadcast message',
                    type: 'info'
                  })
                }
              })

              playerSocket.on('lobby:message', (messageData: any) => {
                expect(messageData).toHaveProperty('message', 'Test broadcast message')
                receivedMessages++
                
                if (receivedMessages === playerCount) {
                  // Clean up
                  hostSocket.disconnect()
                  sockets.forEach(s => s.disconnect())
                  done()
                }
              })
            })
          }
        })
      })
    }, 15000);

    it('should maintain performance under high message frequency', (done) => {
      const messageCount = 100
      const lobbyData = {
        playerData: {
          username: 'perfuser',
          character: 'player1'
        },
        settings: {
          questionCount: 5
        }
      }

      clientSocket.emit('lobby:create', lobbyData)

      clientSocket.on('lobby:created', (data: any) => {
        const lobbyCode = data.lobby.code
        let messageCounter = 0
        
        // Join with another player
        const playerSocket = Client(`http://localhost:${(httpServer.address() as any).port}`)
        
        playerSocket.on('connect', () => {
          playerSocket.emit('lobby:join', {
            lobbyCode,
            playerData: {
              username: 'player2',
              character: 'player2'
            }
          })

          playerSocket.on('lobby:joined', () => {
            // Send rapid messages
            const sendMessages = () => {
              for (let i = 0; i < messageCount; i++) {
                clientSocket.emit('lobby:message', {
                  message: `Test message ${i}`,
                  type: 'chat'
                })
              }
            }

            playerSocket.on('lobby:message', (messageData: any) => {
              messageCounter++
              
              if (messageCounter === messageCount) {
                expect(messageCounter).toBe(messageCount)
                playerSocket.disconnect()
                done()
              }
            })

            sendMessages()
          })
        })
      })
    }, 10000);
  });
}) 