import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { MAP_LAYOUT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';

const VirtualOffice = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { agents, artifacts, setSelectedAgent, setSelectedArtifact } = useGameStore();

    const agentImages = useRef<Record<string, HTMLImageElement>>({});
    const animationFrame = useRef<number>(0);

    useEffect(() => {
        Object.values(agents).forEach(agent => {
            if (!agentImages.current[agent.id] || agentImages.current[agent.id].src !== agent.avatar) {
                const img = new Image();
                img.src = agent.avatar;
                agentImages.current[agent.id] = img;
            }
        });
    }, [agents]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        const gameLoop = (timestamp: number) => {
            animationFrame.current = requestAnimationFrame(gameLoop);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    ctx.fillStyle = MAP_LAYOUT[y][x] === 1 ? '#3a3f4b' : '#2c313a';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }

            Object.values(artifacts).forEach(artifact => {
                ctx.fillStyle = artifact.type === 'code' ? '#f0db4f' : '#cccccc';
                ctx.fillRect(artifact.x * TILE_SIZE + 8, artifact.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(artifact.x * TILE_SIZE + 8, artifact.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            });

            Object.values(agents).forEach(agent => {
                const img = agentImages.current[agent.id];
                if (img && img.complete) {
                    const spriteHeight = img.height;
                    const spriteWidth = agent.isAnimated && agent.frameWidth ? agent.frameWidth : img.width;
                    
                    const aspectRatio = spriteHeight / spriteWidth;
                    const drawWidth = TILE_SIZE;
                    const drawHeight = TILE_SIZE * aspectRatio;
                    const yOffset = drawHeight - TILE_SIZE;

                    if (agent.isAnimated && agent.frameWidth) {
                         const frame = Math.floor(timestamp / 200) % agent.frameCount;
                         ctx.drawImage(img, frame * spriteWidth, 0, spriteWidth, spriteHeight, agent.x * TILE_SIZE, agent.y * TILE_SIZE - yOffset, drawWidth, drawHeight);
                    } else {
                         ctx.drawImage(img, agent.x * TILE_SIZE, agent.y * TILE_SIZE - yOffset, drawWidth, drawHeight);
                    }
                }
            });
        };

        animationFrame.current = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationFrame.current);
        };
    }, [agents, artifacts]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE_SIZE);
        const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE_SIZE);

        const clickedAgent = Object.values(agents).find(agent => agent.x === x && agent.y === y);
        if (clickedAgent) {
            setSelectedAgent(clickedAgent.id);
            return;
        }

        const clickedArtifact = Object.values(artifacts).find(artifact => artifact.x === x && artifact.y === y);
        if (clickedArtifact) {
            setSelectedArtifact(clickedArtifact.id);
            return;
        }

        setSelectedAgent(null);
        setSelectedArtifact(null);
    };

    return (
        <canvas
            ref={canvasRef}
            width={TILE_SIZE * MAP_WIDTH}
            height={TILE_SIZE * MAP_HEIGHT}
            style={{ 
                backgroundColor: '#282c34', 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                imageRendering: 'pixelated',
                width: '95%',
                height: '95%',
                objectFit: 'contain',
                cursor: 'pointer'
            }}
            onClick={handleCanvasClick}
        />
    );
};

export default VirtualOffice;
