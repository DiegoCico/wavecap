import React from "react";
import StockGraph from "../components/StockGraph";

const Stock = ({ stockSymbol }) => {
    const imagePath = `${process.env.PUBLIC_URL}/${stockSymbol}.png`;

    return (
        <div className="graph-container" style={{ position: "relative" }}>
            {/* Company logo */}
            <img 
                src={imagePath} 
                alt={`${stockSymbol} logo`} 
                style={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    width: "50px", // Adjust size as needed
                    height: "50px", // Adjust size as needed
                }} 
            />
            
            {/* Stock graph */}
            <StockGraph stockSymbol={stockSymbol} />
        </div>
    );
};

export default Stock;
