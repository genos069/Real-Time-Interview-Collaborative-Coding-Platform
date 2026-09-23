package com.interviewplatform.backend.importer.parser;

import com.interviewplatform.backend.model.ExecutionMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaSignatureParserTest {

    private JavaSignatureParser parser;

    @BeforeEach
    void setUp() {
        parser = new JavaSignatureParser();
    }

    @Test
    void testParse_SimpleScalarReturnType() {
        String code = """
                class Solution {
                    public int add(int a, int b) {
                        return a + b;
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("Solution", metadata.getClassName());
        assertEquals("add", metadata.getMethodName());
        assertEquals("int", metadata.getReturnType());
        assertEquals(List.of("int", "int"), metadata.getParameterTypes());
        assertEquals(List.of("a", "b"), metadata.getParameterNames());
    }

    @Test
    void testParse_ArrayReturnType() {
        String code = """
                class Solution {
                    public int[] twoSum(int[] nums, int target) {
                        return new int[]{0, 1};
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("Solution", metadata.getClassName());
        assertEquals("twoSum", metadata.getMethodName());
        assertEquals("int[]", metadata.getReturnType());
        assertEquals(List.of("int[]", "int"), metadata.getParameterTypes());
        assertEquals(List.of("nums", "target"), metadata.getParameterNames());
    }

    @Test
    void testParse_GenericListReturnType() {
        String code = """
                class Solution {
                    public List<Integer> getNumbers(int n) {
                        return new ArrayList<>();
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("Solution", metadata.getClassName());
        assertEquals("getNumbers", metadata.getMethodName());
        assertEquals("List<Integer>", metadata.getReturnType());
        assertEquals(List.of("int"), metadata.getParameterTypes());
        assertEquals(List.of("n"), metadata.getParameterNames());
    }

    @Test
    void testParse_NestedGenericReturnType_SolveNQueens() {
        String code = """
                class Solution {
                    public List<List<String>> solveNQueens(int n) {
                        List<List<String>> result = new ArrayList<>();
                        return result;
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("Solution", metadata.getClassName());
        assertEquals("solveNQueens", metadata.getMethodName());
        assertEquals("List<List<String>>", metadata.getReturnType());
        assertEquals(List.of("int"), metadata.getParameterTypes());
        assertEquals(List.of("n"), metadata.getParameterNames());
    }

    @Test
    void testParse_NestedGenericWithSpaces() {
        String code = """
                class Solution {
                    public List < List < String > > solveNQueens(int n) {
                        return new ArrayList<>();
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("solveNQueens", metadata.getMethodName());
        assertEquals("List<List<String>>", metadata.getReturnType());
        assertEquals(List.of("int"), metadata.getParameterTypes());
    }

    @Test
    void testParse_VoidReturnType() {
        String code = """
                class Solution {
                    public void rotate(int[] nums, int k) {
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("rotate", metadata.getMethodName());
        assertEquals("void", metadata.getReturnType());
        assertEquals(List.of("int[]", "int"), metadata.getParameterTypes());
        assertEquals(List.of("nums", "k"), metadata.getParameterNames());
    }

    @Test
    void testParse_GenericParameters() {
        String code = """
                class Solution {
                    public List<String> findWords(List<String> words, Map<String, Integer> freq) {
                        return words;
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("findWords", metadata.getMethodName());
        assertEquals("List<String>", metadata.getReturnType());
        assertEquals(List.of("List<String>", "Map<String,Integer>"), metadata.getParameterTypes());
        assertEquals(List.of("words", "freq"), metadata.getParameterNames());
    }

    @Test
    void testParse_2DArray() {
        String code = """
                class Solution {
                    public int[][] matrixReshape(int[][] mat, int r, int c) {
                        return mat;
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("matrixReshape", metadata.getMethodName());
        assertEquals("int[][]", metadata.getReturnType());
        assertEquals(List.of("int[][]", "int", "int"), metadata.getParameterTypes());
        assertEquals(List.of("mat", "r", "c"), metadata.getParameterNames());
    }

    @Test
    void testParse_WithListNodeDocComment() {
        String code = """
                /**
                 * Definition for singly-linked list.
                 * public class ListNode {
                 *     int val;
                 *     ListNode next;
                 *     ListNode() {}
                 *     ListNode(int val) { this.val = val; }
                 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
                 * }
                 */
                class Solution {
                    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
                        return null;
                    }
                }
                """;

        ExecutionMetadata metadata = parser.parse(code);

        assertEquals("Solution", metadata.getClassName());
        assertEquals("addTwoNumbers", metadata.getMethodName());
        assertEquals("ListNode", metadata.getReturnType());
        assertEquals(List.of("ListNode", "ListNode"), metadata.getParameterTypes());
        assertEquals(List.of("l1", "l2"), metadata.getParameterNames());
    }
}
