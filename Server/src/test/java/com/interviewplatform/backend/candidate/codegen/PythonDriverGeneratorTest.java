package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PythonDriverGeneratorTest {

    private PythonDriverGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new PythonDriverGenerator();
    }

    @Test
    void testGenerate_TwoSumArrayInputAndReturn() {
        String userCode = """
                class Solution:
                    def twoSum(self, nums: List[int], target: int) -> List[int]:
                        mp = {}
                        for i, n in enumerate(nums):
                            if target - n in mp:
                                return [mp[target - n], i]
                            mp[n] = i
                        return []
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("twoSum");
        metadata.setReturnType("int[]");
        metadata.setParameterTypes(List.of("int[]", "int"));

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[2,7,11,15]", "9"));
        tc.setExpectedOutput("[0,1]");

        String generated = generator.generate(userCode, metadata, List.of(tc));

        assertTrue(generated.contains("from typing import *"));
        assertTrue(generated.contains("solution = Solution()"));
        assertTrue(generated.contains("arg0 = [2,7,11,15]"));
        assertTrue(generated.contains("arg1 = 9"));
        assertTrue(generated.contains("res = solution.twoSum(arg0, arg1)"));
        assertTrue(generated.contains("print(_serialize(res, is_list_node=False))"));
    }

    @Test
    void testGenerate_AddTwoNumbersLinkedList_WithMetadata() {
        String userCode = """
                # Definition for singly-linked list.
                # class ListNode:
                #     def __init__(self, val=0, next=None):
                #         self.val = val
                #         self.next = next
                class Solution:
                    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
                        dummy = ListNode(0)
                        curr = dummy
                        carry = 0
                        while l1 or l2 or carry:
                            val = carry
                            if l1:
                                val += l1.val
                                l1 = l1.next
                            if l2:
                                val += l2.val
                                l2 = l2.next
                            curr.next = ListNode(val % 10)
                            carry = val // 10
                            curr = curr.next
                        return dummy.next
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("addTwoNumbers");
        metadata.setReturnType("ListNode");
        metadata.setParameterTypes(List.of("ListNode", "ListNode"));

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[2,4,3]", "[5,6,4]"));
        tc.setExpectedOutput("[7,0,8]");

        String generated = generator.generate(userCode, metadata, List.of(tc));

        // Verifies ListNode definition injected
        assertTrue(generated.contains("class ListNode:"));
        assertTrue(generated.contains("def _build_list_node(vals):"));
        assertTrue(generated.contains("def _serialize(val, is_list_node=False):"));

        // Verifies argument building
        assertTrue(generated.contains("arg0 = _build_list_node([2,4,3])"));
        assertTrue(generated.contains("arg1 = _build_list_node([5,6,4])"));
        assertTrue(generated.contains("res = solution.addTwoNumbers(arg0, arg1)"));
        assertTrue(generated.contains("print(_serialize(res, is_list_node=True))"));
    }

    @Test
    void testGenerate_MoveZeroes_VoidInPlaceMethod() {
        String userCode = """
                class Solution:
                    def moveZeroes(self, nums: List[int]) -> None:
                        pos = 0
                        for n in nums:
                            if n != 0:
                                nums[pos] = n
                                pos += 1
                        while pos < len(nums):
                            nums[pos] = 0
                            pos += 1
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("moveZeroes");
        metadata.setReturnType("void");
        metadata.setParameterTypes(List.of("int[]"));

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[0,1,0,3,12]"));
        tc.setExpectedOutput("[1,3,12,0,0]");

        String generated = generator.generate(userCode, metadata, List.of(tc));

        assertTrue(generated.contains("solution.moveZeroes(arg0)"));
        assertTrue(generated.contains("print(_serialize(arg0))"));
        assertFalse(generated.contains("res = solution.moveZeroes"));
    }

    @Test
    void testGenerate_IsAnagram_BooleanMethod() {
        String userCode = """
                class Solution:
                    def isAnagram(self, s: str, t: str) -> bool:
                        return sorted(s) == sorted(t)
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("isAnagram");
        metadata.setReturnType("boolean");
        metadata.setParameterTypes(List.of("String", "String"));

        TestCase tc = new TestCase();
        tc.setArguments(List.of("\"anagram\"", "\"nagaram\""));
        tc.setExpectedOutput("true");

        String generated = generator.generate(userCode, metadata, List.of(tc));

        assertTrue(generated.contains("res = solution.isAnagram(arg0, arg1)"));
        assertTrue(generated.contains("print(_serialize(res, is_list_node=False))"));
    }

    @Test
    void testGenerate_NullMetadata_FallbackExtraction() {
        String userCode = """
                class Solution:
                    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
                        return None
                """;

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[2,4,3]", "[5,6,4]"));

        String generated = generator.generate(userCode, null, List.of(tc));

        assertTrue(generated.contains("arg0 = _build_list_node([2,4,3])"));
        assertTrue(generated.contains("arg1 = _build_list_node([5,6,4])"));
        assertTrue(generated.contains("res = solution.addTwoNumbers(arg0, arg1)"));
        assertTrue(generated.contains("print(_serialize(res, is_list_node=True))"));
    }

    @Test
    void testGenerate_UserDefinesListNode_DoesNotDuplicate() {
        String userCode = """
                class ListNode:
                    def __init__(self, val=0, next=None):
                        self.val = val
                        self.next = next

                class Solution:
                    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
                        return head
                """;

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[1,2,3]"));

        String generated = generator.generate(userCode, null, List.of(tc));

        // When user code defines class ListNode, generator should not inject its own definition
        assertFalse(generated.contains("# Definition for singly-linked list (injected)"));
    }

    @Test
    void testConvertArgument_Variants() {
        assertEquals("_build_list_node([2,4,3])", generator.convertArgument("ListNode", "[2,4,3]"));
        assertEquals("_build_list_node([2,4,3])", generator.convertArgument("ListNode*", "[2,4,3]"));
        assertEquals("None", generator.convertArgument("ListNode", "[]"));
        assertEquals("None", generator.convertArgument("ListNode", "null"));
        assertEquals("None", generator.convertArgument("ListNode", "None"));

        assertEquals("_build_list_node_vector([[1,4,5],[1,3,4]])",
                generator.convertArgument("vector<ListNode*>", "[[1,4,5],[1,3,4]]"));
        assertEquals("[]", generator.convertArgument("vector<ListNode*>", "[]"));

        assertEquals("True", generator.convertArgument("boolean", "true"));
        assertEquals("False", generator.convertArgument("boolean", "false"));

        assertEquals("\"hello\"", generator.convertArgument("String", "hello"));
        assertEquals("\"hello\"", generator.convertArgument("String", "\"hello\""));
        assertEquals("'c'", generator.convertArgument("char", "c"));
        assertEquals("[1,2,3]", generator.convertArgument("int[]", "[1,2,3]"));
    }
}
