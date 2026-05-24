Plaksha Orbital Pipeline Deck
An interactive Pipeline Hazard Simulation Applet built to visualize how instructions move through a pipelined processor cycle-by-cycle. The simulator helps users understand instruction pipelining, RAW hazards, stall insertion, and data forwarding through an intuitive and educational interface.

Overview
Modern processors execute instructions using instruction pipelining to improve throughput. However, dependencies between instructions can introduce pipeline hazards, causing delays and stalls.
This project simulates a single-issue, in-order processor pipeline and visually demonstrates:
How instructions progress through pipeline stages
How RAW (Read After Write) hazards occur
How stalls are inserted to resolve dependencies
How data forwarding reduces pipeline delays
Differences between 4-stage and 5-stage pipelines
The app was designed as an educational tool to make internal processor behavior easy to understand through visualization and interaction.
Features
Pipeline Configurations
4-Stage Pipeline
IF → ID → EX → MEM/WB
5-Stage Pipeline
IF → ID → EX → MEM → WB
Hazard Detection
Detects RAW (Read After Write) hazards automatically
Displays dependency information clearly:

Example:
RAW Hazard: I1 → I2 on R1
Stall-Based Hazard Resolution
Correctly inserts STALL/BUBBLE cycles when forwarding is disabled
Uses realistic pipeline timing assumptions
Data Forwarding Support
Optional forwarding mode
Reduces unnecessary stalls
Demonstrates optimized pipeline execution
Pipeline Visualization
Cycle-by-cycle execution table
Instructions shown as rows
Cycles shown as columns
Color-coded pipeline stages:
IF
ID
EX
MEM
WB
STALL
Interactive Simulation
Run complete simulation
Step through execution cycle-by-cycle
Reset simulation anytime
Supported Instructions
The simulator currently supports:
ADD R1, R2, R3
SUB R1, R2, R3
LW R1, 0(R2)
SW R1, 0(R2)
Hazard Handling Logic
Without Forwarding
Dependent instructions must wait until the producer instruction completes its write stage.
With Forwarding
Data is forwarded directly between pipeline stages whenever possible to reduce stalls.

Assumptions
The simulator uses the standard split-cycle register file assumption:
Register write-back occurs in the first half of the cycle
Register reads occur in the second half
This allows an instruction in the ID stage to read a value during the same cycle another instruction performs WB.

Tech Stack
React / Next.js
TypeScript
Tailwind CSS


Getting Started
Clone the Repository
git clone <your-repo-link>
cd <repo-name>
Install Dependencies
npm install
Run the Development Server
npm run dev
Open:
http://localhost:3000
📷 Example Scenarios
RAW Hazard Without Forwarding
ADD R1, R2, R3
SUB R4, R1, R5
Result:
Stall cycles inserted before dependent instruction proceeds
RAW Hazard With Forwarding
Same instruction sequence with forwarding enabled:
Fewer stalls
Faster execution schedule

Learning Outcomes
This project demonstrates:
Instruction pipelining
Pipeline scheduling
Dependency analysis
Hazard detection
Stall insertion
Data forwarding
Cycle-level processor behavior

Future Improvements
Possible extensions:
Structural hazards
Branch/control hazards
Branch prediction
Side-by-side comparison mode
Animated stage transitions
Superscalar simulation

Author
Developed as part of a processor architecture and pipelining simulation assignment at Plaksha University.
