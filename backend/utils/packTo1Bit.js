function packTo1Bit(rawBuffer) {
    const length = rawBuffer.length;
    const packedBuffer = Buffer.alloc(Math.ceil(length / 8));
    
    let packedByte = 0;
    let bitCounter = 0;
    let byteIndex = 0;

    for (let i = 0; i < length; i++) {
        // Get the pixel brightness (0-255). 
        // If > 128, consider it White (1), else Black (0).
        // NOTE: Check your specific screen. Usually for e-ink: 
        // 1 = White, 0 = Black.
        const pixel = rawBuffer[i];
        const bit = pixel > 128 ? 1 : 0;

        // Shift bit into position (MSB first)
        packedByte = (packedByte << 1) | bit;
        bitCounter++;

        if (bitCounter === 8) {
            packedBuffer[byteIndex++] = packedByte;
            packedByte = 0;
            bitCounter = 0;
        }
    }
    
    // Handle any remaining bits if width isn't divisible by 8
    if (bitCounter > 0) {
        packedByte = packedByte << (8 - bitCounter);
        packedBuffer[byteIndex] = packedByte;
    }

    return packedBuffer;
}

module.exports = { packTo1Bit };