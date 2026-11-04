
export type ExtractedUnit = {
  title: string;
  topics: string;
};

export type ExtractedPaper = {
  code: string;
  name: string;
  units: ExtractedUnit[];
};

export const extractedBtechPapers: ExtractedPaper[] = [
  {
    code: "ECC-208",
    name: "Digital Electronics",
    units: [
      {
        title: "Unit I — Boolean Algebra and Combinational Logic",
        topics: `Number systems: signed, unsigned, fixed-point and floating-point numbers
Binary codes
Boolean algebra: postulates and theorems
Karnaugh map simplification
Quine-McCluskey method
Logic gate implementations
Adders and subtractors
Magnitude comparators
Encoders and decoders
Multiplexers and code converters
Parity generators and checkers`,
      },
      {
        title: "Unit II — Sequential Circuits",
        topics: `General model of sequential circuits
Flip-flops and latches
Level and edge triggering
Master-slave configuration
State diagrams and state tables
State reduction
Synchronous sequential circuit design
Up/down and modulus counters
Shift registers, ring counters and Johnson counters
Timing diagrams
Serial adders and sequence detectors
Programmable Logic Array (PLA) and Programmable Array Logic (PAL)
Memory units and Random Access Memory (RAM)`,
      },
      {
        title: "Unit III — Basic Computer Organization",
        topics: `Stored-program concept and computer organization
Computer registers and bus systems
Instruction set completeness and instruction cycle
Register Transfer Language
Arithmetic, logic and shift micro-operations
Instruction codes
Design of a simple computer and Arithmetic Logic Unit
Hardwired control unit
Machine-language and assembly-language instructions
Microprogrammed control
Horizontal and vertical microprogramming
CPU instruction sets, formats and addressing modes
Data paths, RISC and CISC characteristics`,
      },
      {
        title: "Unit IV — Computer Arithmetic and Memory Organization",
        topics: `Computer arithmetic
Addition, subtraction, multiplication and division algorithms
Input-output organization
Modes of data transfer and interrupt cycle
Direct Memory Access (DMA)
Input-output processor
Memory organization and hierarchy
Associative memory and cache memory
Internal and external memory
Virtual memory`,
      },
    ],
  },
];
